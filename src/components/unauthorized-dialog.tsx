import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "./ui/item";
import { ShieldAlertIcon } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "./ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UnauthorizedDialog = ({ open, onOpenChange }: Props) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle />
        <div className="max-w-1 absolute top-2 right-10">
          <AlertDialogCancel>X</AlertDialogCancel>
        </div>
        <div className="flex justify-center items-center bg-background">
          <Item variant="muted" className="bg-background w-full">
            <ItemMedia variant="icon">
              <ShieldAlertIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Unauthorized access</ItemTitle>
              <ItemDescription>
                You are not authorized to perform this action
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <SignInButton mode="modal">
                <Button
                  variant="outline"
                  className="border-blue-700 px-4 py-2 text-blue-700 hover:bg-blue-500 hover:border-none hover:text-white"
                >
                  Sign in
                </Button>
              </SignInButton>
            </ItemActions>
          </Item>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
